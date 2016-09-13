import base64
import io
from json import dumps
from werkzeug.utils import secure_filename, redirect
from conf import *
from util import *
from wsgi import app
from flask import render_template, request, jsonify, Response, send_file
import qrcode as qr
from qrcode.image.svg import SvgPathFillImage
from uuid import uuid4

__author__ = 'an'


@app.route('/', methods=['GET', 'POST'])
def home_page():
    if request.method == 'GET':
        return render_template('index.html')
    else:
        f = request.files.get('file')
        if not f:
            data = {
                'msg': 'File not found'
            }
            return Response(response=dumps(data), status=400, mimetype='application/json')

        fname = secure_filename(f.filename)
        rdir = uuid4()
        fdir = rdir.hex
        path = BASE + UPLOAD_DIR + fdir
        os.makedirs(path, exist_ok=True)
        fpath = path + '/{}'.format(fname)
        f.save(fpath)

        t = fname.split('.')
        tname = t[0]
        size = os.stat(fpath).st_size

        if size >= 1000000:
            size = str(round(size / 10000) / 100) + ' MB'
        elif size >= 1000:
            size = str(round(size / 10) / 100) + ' KB'
        else:
            size = str(size) + ' B'

        file = {
            'name': tname,
            'dir': fdir,
            'size': size,
            'file': fname
        }
        ts = render_template('download.html', file=file)

        url = HOST + '/download/' + fdir + '/{}'.format(tname)
        name = path + '/{}.html'.format(tname)
        with open(str(name), 'w') as fw:
            fw.write(ts)

        img_buf = io.BytesIO()
        factory = SvgPathFillImage
        img = qr.make(url, box_size=20, image_factory=factory)
        img.save(img_buf)
        buf = img_buf.getvalue()
        data = base64.b64encode(buf)
        qr_code = 'data:image/svg+xml;base64,' + data.decode()

        md5 = md5_sum(f)
        sha = sha_sum(f)
        msg = render_template('dialog.html', url=url, qr=qr_code, md5=md5, sha=sha, fname=fname)
        data = {
            'msg': msg
        }
        return jsonify(data)


@app.route('/download/<idx>/<name>')
def download_file(idx, name):
    f = request.args.get('file', '')
    f = f.strip()
    if not f:
        file = 'files/{}/{}.html'.format(idx, name)
        try:
            return app.send_static_file(file)
        except:
            return redirect('/', 301)

    fname = secure_filename(f)
    file = BASE + UPLOAD_DIR + '{}/{}'.format(idx, fname)
    if not os.path.isfile(file):
        data = {
            'msg': 'File not found'
        }
        return Response(response=dumps(data), status=422, mimetype='application/json')

    return send_file(file, as_attachment=True)
