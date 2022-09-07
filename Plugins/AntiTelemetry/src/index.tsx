import { Messages } from 'emnity/metro/common';
import { Plugin, registerPlugin } from 'emnity/managers/plugins';
import { create } from 'emnity/patcher';
import manifest from '../manifest.json';

const Patcher = create('anti-telemetry');

const Chars = ['\u200b', '\u200c', '\u200d', '\ufeff'];

const AntiTelemetry: Plugin = {
    name: 'AntiTelemetry',
    version: '1.0.0',
    description: 'Obfuscates messages by silently injecting random invisible unicode characters.',
    authors: [
      {
         name: "MagicSpells",
         id: "999391084398522368"
      }
    ],

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