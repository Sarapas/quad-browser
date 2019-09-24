import { getHistorySuggestions, getSearchSuggestions } from './suggestions';
import { isURL } from './utils/url';
import { ISuggestion } from './interfaces/suggestion';

let searchSuggestions: ISuggestion[] = [];

export class SuggestionsStore {
  public list: ISuggestion[] = [];
  public selected = 0;
  public height = 0;

  constructor() {
  }

  public load(input: HTMLInputElement): Promise<string> {
    return new Promise(async resolve => {
      const filter = input.value.substring(0, input.selectionStart || 0);
      const history = getHistorySuggestions(filter);

      const historySuggestions: ISuggestion[] = [];

      if ((!history[0] || !history[0].canSuggest) && filter.trim() !== '') {
        historySuggestions.unshift({
          primaryText: filter,
          secondaryText: 'search in Google',
          isSearch: true,
        });
        if (isURL(filter)) {
          historySuggestions.unshift({
            primaryText: filter,
            secondaryText: 'open website',
          });
        }
      }

      for (const item of history) {
        if (!item.isSearch) {
          historySuggestions.push({
            primaryText: item.url || '',
            secondaryText: item.title,
            canSuggest: item.canSuggest,
          });
        } else {
          historySuggestions.push({
            primaryText: item.url || '',
            secondaryText: 'search in Google',
            canSuggest: item.canSuggest,
          });
        }
      }

      let suggestions: ISuggestion[] =
        input.value === ''
          ? []
          : historySuggestions.concat(searchSuggestions).slice(0, 5);

      for (let i = 0; i < suggestions.length; i++) {
        suggestions[i].id = i;
      }

      this.list = suggestions;

      if (historySuggestions.length > 0 && historySuggestions[0].canSuggest) {
        resolve(historySuggestions[0].primaryText);
      }

      try {
        const searchData = await getSearchSuggestions(filter);

        if (input.value.substring(0, input.selectionStart || 0) === filter) {
          searchSuggestions = [];
          for (const item of searchData) {
            searchSuggestions.push({
              primaryText: item,
              isSearch: true,
            });
          }

          suggestions =
            input.value === ''
              ? []
              : historySuggestions.concat(searchSuggestions).slice(0, 5);

          for (let i = 0; i < suggestions.length; i++) {
            suggestions[i].id = i;
          }

          this.list = suggestions;
        }
      } catch (e) {
        console.error(e);
      }
    });
  }
}