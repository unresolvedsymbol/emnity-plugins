import { Messages } from 'enmity/metro/common';
import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import manifest from '../manifest.json';

const Patcher = create('anti-telemetry');

const Chars = ['\u200b', '\u200c', '\u200d', '\ufeff'];

const AntiTelemetry: Plugin = {
    ...manifest,

    onStart() {
        const obfuscateMessage = (message: string) => {
            var words = message.split(" ");
            for (var word in words) {
                const firstChar = word[0];
                var firstCodePt;
                // toLowerCase != toUpperCase is a wacky way to check if it's a normal letter
                if (!firstChar || !(firstCodePt = firstChar.codePointAt(0))
                    || word.startsWith("http") // Skip links
                    || (word.startsWith(":") && word.endsWith(":")) // Skip Discord emoji
                    || word.length < 3 // Short words are probably not worth obfuscating
                    || firstChar.toLowerCase() == word[0].toUpperCase() // Make sure it's a normal latin letter
                    || firstCodePt > 127) // Make sure it's not already unicode
                    continue;

                const wordSplitIndex = ~~(Math.random() * (word.length - 1)) + 1; // Be at least 1 char from the start or end of the word
                word = word.substring(0, wordSplitIndex) + Chars[~~(Math.random() * Chars.length)] + word.substring(wordSplitIndex);
            }
            return words.join(" ");
        };

        Patcher.instead(Messages, 'sendMessage', (self, args, orig) => {
            const [channelId, opts] = args;
            if (!opts?.content || !channelId) {
                return orig.apply(self, args);
            }
            
            opts.content = obfuscateMessage(opts.content);

            return orig.apply(self, [channelId, opts]);
        });
    },

    onStop() {
        Patcher.unpatchAll();
    }
};

registerPlugin(AntiTelemetry);