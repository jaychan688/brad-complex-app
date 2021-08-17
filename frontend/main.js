import Search from './modules/search'

if (document.querySelector('.header-search-icon')) {
	// Unless login and show the search icon, the search function will not ran
	new Search()
}
