const Player = function () {
    var beat = 0;
    var sample = 0;

    const samples = [
        [ new Audio('c.mp3'), new Audio('c.distant.mp3'), ],
        [ new Audio('c.mp3'), new Audio('c.distant.mp3'), ],
        [ new Audio('c.mp3'), new Audio('c.distant.mp3'), ],
        [ new Audio('c.mp3'), new Audio('c.distant.mp3'), ],
    ];

    this.play = function (measure) {
        samples[sample][beat == 0 ? 0 : 1].play();

        beat += 1;
        if (beat >= measure) {
            beat = 0;
        }

        sample += 1;
        sample %= samples.length;
    };

    this.reset = function () {
        beat = 0;
    };
}

const Clock = function (_callback) {
    const callback = _callback;
    var interval = 10000;
    var last_tick = null;
    var timeout_id = null;

    const now = function() {
        return new Date().getTime();
    };

    const tick = function() {
        last_tick += interval;
        callback();
        timeout_id = setTimeout(tick, last_tick + interval - now());
    };

    Object.defineProperty(this, 'active', {
        get () {
            return timeout_id != null;
        },
        set (_active) {
            let active = this.active;
            if (_active && !active) {
                last_tick = now();
                callback();
                timeout_id = setTimeout(tick, interval);
            }
            else if (!_active && active) {
                clearTimeout(timeout_id);
                timeout_id = null;
            }
        },
    });

    Object.defineProperty(this, 'interval', {
        get () {
            return interval;
        },
        set (_interval) {
            interval = _interval;
            if (this.active) {
                clearTimeout(timeout_id);
                var _timeout = last_tick + interval - now();
                if (_timeout > 0) {
                    timeout_id = setTimeout(tick, _timeout);
                }
                else {
                    tick();
                }
            }
        },
    });
}

const Metronome = function(_bpm, _measure) {
    const self = this;
    this.measure = _measure;

    const player = new Player();

    const clock = new Clock(function() {
        player.play(self.measure);
    });

    var bpm;
    Object.defineProperty(this, 'bpm', {
        get() {
            return bpm;
        },
        set(_bpm) {
            bpm = _bpm;
            clock.interval = 60000.0 / bpm;
        },
    });
    this.bpm = _bpm;

    Object.defineProperty(this, 'active', {
        get() {
            return clock.active;
        },
        set(_active) {
            if (_active != clock.active) {
                player.reset();
            }
            clock.active = _active;
        },
    });
};

metronome = new Metronome(120, 4);
