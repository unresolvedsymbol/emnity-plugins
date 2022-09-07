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
            for (var i = 0; i < words.length; ++i) {
                var word = words[i], firstChar = words[i][0], firstCodePt;

                if (!firstChar //|| !(firstCodePt = firstChar.codePointAt(0))
                    || words[i].startsWith("http") // Skip links
                    || (word.startsWith(":") && word.endsWith(":")) // Skip Discord emoji
                    || word.length < 3 // Short words are probably not worth obfuscating
                    || firstChar.toLowerCase() == word[0].toUpperCase() // Make sure it's a normal latin letter
                    || firstCodePt > 127) // Make sure it's not already unicode
                    continue;

                // This doesn't work as well as I'd like it to
                /*
                const wordSplitIndex = ~~(Math.random() * (word.length - 1)) + 1; // Be at least 1 char from the start or end of the word
                words[i] = word.substring(0, wordSplitIndex) + Chars[~~(Math.random() * Chars.length)] + word.substring(wordSplitIndex);
                */

                // Every 2 characters
                for (var j = 1; j < word.length; j += 3)
                    words[i] = word = word.substring(0, j) + Chars[~~(Math.random() * Chars.length)] + word.substring(j);
            }
            return words.join(" ");
        };

        Patcher.before(Messages, 'sendMessage', (_, [channelId, message]) => {
            if (!message?.content || !channelId)
                return;
            
            message.content = obfuscateMessage(message.content);
        });
    },

    onStop() {
        Patcher.unpatchAll();
    }
};

registerPlugin(AntiTelemetry);