// import { ipcRenderer, remote } from 'electron';
// import { IHistoryItem } from './interfaces/history-item';
// import { Database } from './database';
// import { SuggestionsStore } from './suggestion-store';

// let lastSuggestion: string;

// export class Store {
//   public suggestions = new SuggestionsStore();
//   public history: IHistoryItem[] = [];
//   public inputText = '';

//   public canSuggest = false;

//   public historyDb = new Database<IHistoryItem>('history');

//   public id = remote.getCurrentWebContents().id;

//   public constructor() {
//     this.suggestions.list = [];
//     this.loadHistory();
//   }

//   public async loadHistory() {
//     const items = await this.historyDb.get({});

//     items.sort(
//       (a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime(),
//     );

//     this.history = items;
//   }

//   public suggest() {
//     const { suggestions } = this;
//     const input = this.inputRef.current;

//     if (this.canSuggest) {
//       this.autoComplete(input.value, lastSuggestion);
//     }

//     suggestions.load(input).then(suggestion => {
//       lastSuggestion = suggestion;
//       if (this.canSuggest) {
//         this.autoComplete(
//           input.value.substring(0, input.selectionStart),
//           suggestion,
//         );
//         this.canSuggest = false;
//       }
//     });

//     suggestions.selected = 0;
//   }

//   public autoComplete(text: string, suggestion: string) {
//     const regex = /(http(s?)):\/\/(www.)?|www./gi;
//     const regex2 = /(http(s?)):\/\//gi;

//     const start = text.length;

//     const input = this.inputRef.current;

//     if (input.selectionStart !== input.value.length) return;

//     if (suggestion) {
//       if (suggestion.startsWith(text.replace(regex, ''))) {
//         input.value = text + suggestion.replace(text.replace(regex, ''), '');
//       } else if (`www.${suggestion}`.startsWith(text.replace(regex2, ''))) {
//         input.value =
//           text + `www.${suggestion}`.replace(text.replace(regex2, ''), '');
//       }
//       input.setSelectionRange(start, input.value.length);
//     }
//   }
// }

// export default new Store();