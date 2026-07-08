const fs = require('fs');

const filePath = 'D:/Projects/AsiaMsg/frontend/src/App.tsx';
const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

const replacements = new Map([
  [188, "    triggerToast(lang === 'RU' ? '\u042f\u0437\u044b\u043a \u0438\u0437\u043c\u0435\u043d\u0451\u043d \u043d\u0430 \u0440\u0443\u0441\u0441\u043a\u0438\u0439' : 'Language set to English');"],
  [195, "        ? (state.language === 'RU' ? '\u0421\u0432\u0435\u0442\u043b\u0430\u044f \u0442\u0435\u043c\u0430 \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u0430' : 'Light theme activated')"],
  [197, "          ? (state.language === 'RU' ? '\u0422\u0451\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430 \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u0430' : 'Dark theme activated')"],
  [198, "          : (state.language === 'RU' ? '\u0421\u0438\u0441\u0442\u0435\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u0430' : 'System theme selected');"],
  [204, "    triggerToast(state.language === 'RU' ? '\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d' : 'Profile saved successfully');"],
  [266, "            \u2713"],
  [279, "              \u00d7"],
  [287, "                <h3 className=\"text-base font-bold text-slate-900\">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c WhatsApp \u043d\u043e\u043c\u0435\u0440</h3>"],
  [288, "                <p className=\"mt-0.5 text-[10px] text-slate-400\">\u0418\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f \u043d\u043e\u0432\u043e\u0433\u043e \u043a\u0430\u043d\u0430\u043b\u0430 \u0441\u0432\u044f\u0437\u0438</p>"],
  [294, "                <label className=\"block text-xs font-bold uppercase text-slate-400\">\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438\u043d\u0441\u0442\u0430\u043d\u0441\u0430</label>"],
  [300, "                  placeholder=\"\u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440, Sales Bot\""],
  [306, "                <label className=\"block text-xs font-bold uppercase text-slate-400\">\u041d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430</label>"],
  [318, "                <label className=\"block text-xs font-bold uppercase text-slate-400\">\u041f\u0440\u043e\u0432\u0430\u0439\u0434\u0435\u0440 \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u0438</label>"],
  [335, "                  \u041e\u0442\u043c\u0435\u043d\u0430"],
  [342, "                  <span>\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c</span>"]
]);

for (const [lineNumber, value] of replacements.entries()) {
  if (lineNumber >= 0 && lineNumber < lines.length) {
    lines[lineNumber] = value;
  }
}

fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
