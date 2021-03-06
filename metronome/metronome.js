const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const debug = function(_text) {
    const ul = document.querySelector("#debug");
    const li = document.createElement("li");
    const text = document.createTextNode(_text);
    li.appendChild(text);
    ul.appendChild(li);
};

const fetchAudioBuffer = function (_request) {
    return fetch(_request)
        .then(response => {
            return response.arrayBuffer();
        })
        .then(arrayBuffer => {
            // The promise interface of decodeAudioData does not work on Safari
            return new Promise((resolve, reject) => {
                audioContext.decodeAudioData(arrayBuffer, resolve, reject);
            });
        });
};

const Scheduler = function (_interval, _bufStrong, _bufWeak) {
    const bufStrong = _bufStrong;
    const bufWeak = _bufWeak;
    const interval = _interval; // seconds

    this.period = 0.500; // seconds
    this.beatsPerBar = 4;

    var beatCount = 0;
    var beatTime = audioContext.currentTime;

    this.schedule = function () {
        if (beatTime == null) {
            beatTime = audioContext.currentTime - this.period;
        }
        while (beatTime + this.period <= audioContext.currentTime + interval) {
            if (beatCount >= this.beatsPerBar) {
                beatCount = 0;
            }
            const buffer = (beatCount == 0) ? bufStrong : bufWeak;
            beatCount += 1;
            beatTime += this.period;

            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start(beatTime);
        }
    };

    this.reset = function () {
        beatCount = 0;
        beatTime = null;
    };
};

const Clock = function (_period, _callback) {
    const callback = _callback;
    var period = _period * 1000.0; // milliseconds
    var timeoutId = null;

    const tick = function() {
        callback();
        timeoutId = setTimeout(tick, period);
    };

    Object.defineProperty(this, 'active', {
        get () {
            return timeoutId != null;
        },
        set (_active) {
            let active = this.active;
            if (this.active) {
                if (!_active) {
                    console.log("clock.active, disabling");

                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            } else {
                if (_active) {
                    console.log("clock.active, enabling");
                    tick();
                }
            }
        },
    });
}

const Metronome = function(_beatsPerMinute, _beatsPerBar, _clockPeriod, _schedulerInterval, _bufStrong, _bufWeak) {
    const scheduler = new Scheduler(_schedulerInterval, _bufStrong, _bufWeak);
    const clock = new Clock(_clockPeriod, () => scheduler.schedule());

    var beatsPerMinute;
    Object.defineProperty(this, 'beatsPerMinute', {
        get() {
            return beatsPerMinute;
        },
        set(_beatsPerMinute) {
            beatsPerMinute = _beatsPerMinute;
            scheduler.period = 60.0 / beatsPerMinute;
        },
    });
    this.beatsPerMinute = _beatsPerMinute;

    Object.defineProperty(this, 'beatsPerBar', {
        get() {
            return scheduler.beatsPerBar;
        },
        set(_beatsPerBar) {
            scheduler.beatsPerBar = _beatsPerBar;
        },
    });
    this.beatsPerBar = _beatsPerBar;

    Object.defineProperty(this, 'active', {
        get() {
            return clock.active;
        },
        set(_active) {
            if (_active != clock.active) {
                scheduler.reset();
            }
            clock.active = _active;
        },
    });
};
