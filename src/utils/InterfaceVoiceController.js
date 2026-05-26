class InterfaceVoiceController {
    constructor(scene, handleCommand) {
        this.scene = scene;
        this.handleCommand = handleCommand;
        this.recognition = null;
        this.isEnabled = false;
    }

    start() {
        if (this.isEnabled) {
            return true;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            return false;
        }

        if (!this.recognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'es-ES';
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            this.recognition.onstart = () => {
                this.scene.registry.set('voicePermissionGranted', true);
            };
            this.recognition.onresult = (event) => {
                for (let index = event.resultIndex; index < event.results.length; index += 1) {
                    if (event.results[index].isFinal) {
                        this.handleCommand(InterfaceVoiceController.normalize(event.results[index][0].transcript));
                    }
                }
            };
            this.recognition.onerror = (event) => {
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    this.scene.registry.set('voicePermissionGranted', false);
                    this.isEnabled = false;
                }
            };
            this.recognition.onend = () => {
                if (!this.isEnabled || !this.scene.sys.settings.active) {
                    return;
                }

                try {
                    this.recognition.start();
                } catch (error) {
                    this.isEnabled = false;
                }
            };
        }

        this.isEnabled = true;

        try {
            this.recognition.start();
        } catch (error) {
            this.isEnabled = false;
        }

        return this.isEnabled;
    }

    stop() {
        this.isEnabled = false;

        if (this.recognition) {
            this.recognition.abort();
        }
    }

    destroy() {
        this.isEnabled = false;

        if (!this.recognition) {
            return;
        }

        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
        this.recognition = null;
    }

    static normalize(transcript) {
        return transcript.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }
}

window.InterfaceVoiceController = InterfaceVoiceController;
