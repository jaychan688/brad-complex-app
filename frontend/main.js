import Search from './modules/search'
import Chat from './modules/chat'

if (document.querySelector('#chat-wrapper')) {
	new Chat()
}

if (document.querySelector('.header-search-icon')) {
	// Unless login and show the search icon, the search function will not ran
	new Search()
}
