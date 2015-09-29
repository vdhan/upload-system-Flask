import hashlib

__author__ = 'an'

def md5Sum(f, block = 10000000): # 10 MB/block
	h = hashlib.md5()
	data = f.read(block)
	while len(data) > 0:
		h.update(data)
		data = f.read(block)

	return h.hexdigest()

def shaSum(f, block = 10000000): # 10 MB/block
	h = hashlib.sha256()
	data = f.read(block)
	while len(data) > 0:
		h.update(data)
		data = f.read(block)

	return h.hexdigest()