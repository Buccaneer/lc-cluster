const Writable = require('stream').Writable;
const fs = require('graceful-fs');

module.exports = class pageWriterStream extends Writable {

  constructor(targetPath, size) {
    super({ objectMode: true });
    this._targetPath = targetPath + '/';
    this._size = size;
    this._byteCount = 0;
    this._currentFileName = '';
    this._wstream = '';
    this._lastDepartureTime = null;
  }

  _write(data, encoding, done) {
    let dataString = JSON.stringify(data);
    let buffer = Buffer.from(dataString);

    if (this._currentFileName == '') {
      // Note so elegant solution to make sure closing ] is there
      if (data === ']') {
        done();
        return;
      }
      this._currentFileName = data.departureTime.replace(new RegExp(':', 'g'),'D');
      this._wstream = fs.createWriteStream(this._targetPath + this._currentFileName + '.jsonld');
      this._wstream.write('[' + dataString);
      this._byteCount += buffer.byteLength;
    } else {
      // Note so elegant solution to make sure closing ] is there
      if (data === ']') {
        this._wstream.write(data);
        done();
        return;
      }
      if (this._byteCount >= this._size && data.departureTime != this._lastDepartureTime) {
        this._wstream.write(']');
        this._wstream.end();
        this._currentFileName = data.departureTime.replace(new RegExp(':', 'g'),'D');
        this._wstream = fs.createWriteStream(this._targetPath + this._currentFileName + '.jsonld');
        this._wstream.write('[' + dataString);
        this._byteCount = buffer.byteLength;
      } else {
        this._wstream.write(',\n' + dataString);
        this._byteCount += buffer.byteLength;
      }
    }
    this._lastDepartureTime = data.departureTime;
    done();
  }
}
