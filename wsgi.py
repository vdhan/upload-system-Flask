from flask import Flask

__author__ = 'an'

app = Flask(__name__, static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = 50000000 # use base 10
app.debug = True

from view import *
if __name__ == '__main__':
	host = '0.0.0.0'
	port = 10002
	app.run(host, port)