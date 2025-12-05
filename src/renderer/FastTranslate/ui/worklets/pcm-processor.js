// src/ui/worklets/pcm-processor.js
/* eslint-disable no-undef */
// Mikrofon girişini Float32 PCM örnekleri halinde parçalayıp main thread'e gönderir
class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.chunkSize = Number(opts.chunkSize || 4096);
    this._buffer = new Float32Array(0);
  }

  _appendBuffer(input) {
    if (!input || input.length === 0) return;
    const oldLen = this._buffer.length;
    const newBuf = new Float32Array(oldLen + input.length);
    newBuf.set(this._buffer, 0);
    newBuf.set(input, oldLen);
    this._buffer = newBuf;
  }

  _flushChunks() {
    while (this._buffer.length >= this.chunkSize) {
      const chunk = this._buffer.subarray(0, this.chunkSize);
      const copy = new Float32Array(chunk.length);
      copy.set(chunk);
      this.port.postMessage({ type: 'audio', samples: copy }, [copy.buffer]);

      const remaining = this._buffer.subarray(this.chunkSize);
      const tail = new Float32Array(remaining.length);
      tail.set(remaining);
      this._buffer = tail;
    }
  }

  process(inputs) {
    const inputChannelData = (inputs[0] && inputs[0][0]) || null; // mono varsayıyoruz

    if (inputChannelData) {
      this._appendBuffer(inputChannelData);
      this._flushChunks();
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);