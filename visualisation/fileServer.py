#! /bin/env python3

from pathlib import Path
from os import path, pardir
from zmq import Context, REP
from json import load, dumps, dump
from threading import Thread, BoundedSemaphore

NAME_WARNING_MESSAGE = "The name which you are looked for doesn't exists. You need to register the bee firstly"
EMPTY_ERROR_MESSAGE = "No datas stored, you need to register the bee firstly"
NAME_EXISTS_ERROR_MESSAGE = "You can't register a name twice. Did you forget to restart the server?"

killServer = False
context = Context()
beeSet = set()

"""
Data error class.
"""
class DataError(Exception):
	pass

"""
This class manages the accesses to the json files.
It includes one thread for receiving data on port 5555 and a thread for sending the data on port 5556.
Instead of using it as server you can also just import the class into your own script and just use it for read and write.
author: Sven Wolff
"""
## Possible performance boost: only receive the new data, currently not needed, if changing these you have to change the dump method too. (read the dump data append the new and dump it again)
class BeeJSON:

	__FILE_EXTENSION = ".json"
	__DATA_DIR = Path(__file__).parent / "data"
	__indexListDict = { 0: "iMin", 1: "iMax", 2: "robNbr", 3: "arnSize" }
	__maxLocals = [0, 0, 0 ,0] 																				## stores the size of the biggest lists which one of the bee's has; used to ensure that 
																																		## every iMin, iMax, ... list has the same length
	def __init__(self, name: str):
		self.__name = name
		self.__filePath = self.__DATA_DIR / f"name{self.__FILE_EXTENSION}"
		self.__jsonMutex = BoundedSemaphore()
		self.__lastIndices = {}

	"""
	Dumps the given data to the corresponding json file
	analytics: The data as dictionary object.
	"""
	def dumper(self, analytics: dict) -> None:
		self.__jsonMutex.acquire()
		analytics = self.__listsOnSameLength(analytics)
		with open(self.__filePath, "w+") as file:
			dump(analytics, file, indent=2)
		self.__jsonMutex.release()

	"""
	Reads the data from the correspondig json file.
	return: Returns the data of the json file as dictionary.
	"""
	def reader(self, ip: str, reset: bool) -> dict:
		self.__jsonMutex.acquire()
		if reset:
			self.__lastIndices[ip] = [0, 0, 0, 0]
		with open(self.__filePath) as file:
			analytics = load(file)
		self.__jsonMutex.release()
		analytics = self.__removeKnownData(ip, analytics)
		return analytics

	"""
	Updates the maxLocals list.
	data: The data as dictionary.
	"""
	def __updateMaxLocals(self, data: dict) -> None:
		i = 0
		while i < len(self.__maxLocals):
			if self.__maxLocals[i] < data.get("valsLocal").get(self.__indexListDict.get(i))[-1][1]:
				self.__maxLocals[i] = data.get("valsLocal").get(self.__indexListDict.get(i))[-1][1]
			i += 1

	"""
	Updates the list size from every list so that every bees iMin, ... lists are on the same length.
	data: The dictionary which contains the values.
	return: The dictionary with all lists on same length.
	"""
	def __listsOnSameLength(self, data: dict) -> dict:
		self.__updateMaxLocals(data)
		i = 0
		while i < len(self.__maxLocals):
			if self.__maxLocals[i] > data.get("valsLocal").get(self.__indexListDict.get(i))[-1][1]:
				lastElement = data.get("valsLocal").get(self.__indexListDict.get(i))[-1]
				lastTime = float(lastElement[1])
				timeAdd = 1
				while self.__maxLocals[i] > data.get("valsLocal").get(self.__indexListDict.get(i))[-1][1]:
					data.get("valsLocal").get(self.__indexListDict.get(i)).append([lastElement[0], lastTime + timeAdd])
					timeAdd += 1
			i += 1
		return data

	"""
	Removes the data from the lists in the dictionary which are send in a previous.
	data: The dictionary which contains the old values.
	return: The dictionary without the old values.
	"""
	def __removeKnownData(self, ip: str, data: dict) -> dict:
		i = 0
		while i < len(self.__lastIndices.get(ip)):
			if self.__lastIndices.get(ip)[i] <= 0:
				self.__lastIndices[ip][i] = len(data.get("valsLocal").get(self.__indexListDict.get(i)))				## update the indice
			else:
				length = len(data.get("valsLocal").get(self.__indexListDict.get(i)))													## get new indice value
				data.get("valsLocal")[self.__indexListDict.get(i)] = data.get("valsLocal").get(self.__indexListDict.get(i))[self.__lastIndices.get(ip)[i]:]		## only take the new data
				self.__lastIndices[ip][i] = length 																														## update the indice	
			i += 1
		return data

	## Getter
	def getName(self) -> str:
		return self.__name

	def getFilePath(self) -> str:
		return self.__filePath


"""
This method adds new Bees to the set if the name is unique.
name: The name of the bee as string.
return: An error message as string if the name already exists.
"""
def register(name: str) -> str:
	if beeSet: 
		for i in beeSet:
			if i.getName() == name:
				setKillServer(True)
				raise DataError(NAME_EXISTS_ERROR_MESSAGE)
	bee = BeeJSON(name)
	f = open(bee.getFilePath(), "w")
	f.close()
	beeSet.add(bee)

"""
This method reads the corresponding json file to the given bee.
name: The name of the bee as string.
return: Returns the data of the json file as dict or an error as string if no datas or the name doesn't exists.
"""
def read(name: str, ip: str, reset: bool) -> dict:
	if beeSet:
		for i in beeSet:
			if i.getName() == name:
				return i.reader(ip, reset)
		print (f"Warning: {NAME_WARNING_MESSAGE} -> {name}")
		return ""
	else:
		print (f"DataError: {EMPTY_ERROR_MESSAGE} -> {name}")
		return ""
"""
This method dumps the json dictionary to the corresponding json file from the given bee.
name: The name of the bee as string.
analytics: The data which should be stored as dictionary.
return: An error as string if the name doesn't exists or the set doesn't contains any data.
"""
def write(name: str, analytics: dict) -> None:
	if beeSet:
		for i in beeSet:
			if i.getName() == name:
				i.dumper(analytics)
				return
		setKillServer(True)
		raise DataError(f"{NAME_WARNING_MESSAGE}: {name}")
	else:
		setKillServer(True)
		raise DataError(f"{EMPTY_ERROR_MESSAGE}: {name}")

"""
This method is started as own thread. It's a server which receives dictionaries and saves them into local file or registers the client.
The server expects the json data with the field name. 
"""
def writeThread() -> None:
	writeSocket = context.socket(REP)
	writeSocket.bind("tcp://127.0.0.1:5555")							## zmq can't handle "localhost" so we use the equivalent address
	print("Write server is running on port: 5555\n")
	while not killServer:
		analytics = writeSocket.recv_json()
		writeSocket.send_string("ACK")
		if analytics.get("sendState") == "w":
			write(analytics.get("name"), analytics)
			print(f"Got data from {analytics.get('name')}")
		else:
			register(analytics.get("name"))
			write(analytics.get("name"), analytics)
			print(f"Registered {analytics.get('name')} ({len(beeSet)})")
	writeSocket.close()

"""
This method is started as own thread. It's a server which receives requests for reading a json file and response with the content of it.
The server expects the name of the bee as string on 127.0.0.1:5556
"""
def readThread() -> None:
	readSocket = context.socket(REP)
	readSocket.bind("tcp://127.0.0.1:5556")		## zmq can't handle "localhost" so we use the equivalent address
	print("Read-server is running on port: 5556")
	while not killServer:
		data = (readSocket.recv()).decode("utf-8").split(",")
		name = data[0]
		ip = data[1]
		bReset = data[2] == "true"
		beeData = read(name, ip, bReset)
		if not beeData == "":
			print(f"Have read {name}.json")
		beeData = dumps(beeData)
		readSocket.send(beeData.encode("utf-8"))
	readSocket.close()

def setKillServer(loc_killServer: bool):
	global killServer
	killServer = loc_killServer

## Main
if __name__ == "__main__":
	jsonReader = Thread(target=readThread)
	jsonReader.daemon = True
	try:
		jsonReader.start()
		writeThread()
	except KeyboardInterrupt:
		print("\nServer canceled by user")
	except Exception as e:
		print(e)
	
