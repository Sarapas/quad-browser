import { ISearchEngine } from "./interfaces/search-engine";

export const duckDuckGo : ISearchEngine = {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=%s',
    keywordsUrl: ''
};

export const google : ISearchEngine = {
    name: 'Google',
    url: 'https://www.google.com/search?q=%s',
    keywordsUrl: 'http://google.com/complete/search?client=chrome&q=%s'
};

export const bing : ISearchEngine = {
    name: 'Bing',
    url: 'https://www.bing.com/search?q=%s',
    keywordsUrl: ''
};

export const ecosia : ISearchEngine = {
    name: 'Ecosia',
    url: 'https://www.ecosia.org/search?q=%s',
    keywordsUrl: ''
};

export const yahoo : ISearchEngine = {
    name: 'Yahoo!',
    url: 'https://search.yahoo.com/search?p=%s',
    keywordsUrl: ''
}