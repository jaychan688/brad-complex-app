import DOMPurify from 'dompurify'

export default class Chat {
	constructor() {
		this.openedYet = false
		this.chatWrapper = document.querySelector('#chat-wrapper')
		this.openIcon = document.querySelector('.header-chat-icon')
		// After injectHTML(), the element below are exists
		this.injectHTML()
		this.closeIcon = document.querySelector('.chat-title-bar-close')
		this.chatForm = document.querySelector('#chatForm')
		this.chatField = document.querySelector('#chatField')
		this.chatLog = document.querySelector('#chat')
		this.events()
	}

	// Events
	events() {
		this.chatForm.addEventListener('submit', e => {
			e.preventDefault()
			this.sendMessageToServer()
		})
		this.openIcon.addEventListener('click', () => this.showChat())
		this.closeIcon.addEventListener('click', () => this.hideChat())
	}

	sendMessageToServer() {
		// the second argument will send to server, and reprents as data
		// socket.on('chatMessageFromBrowser', data)
		this.socket.emit('chatMessageFromBrowser', {
			message: this.chatField.value,
		})

		this.chatLog.insertAdjacentHTML(
			'beforeend',
			DOMPurify.sanitize(`
    <div class="chat-self">
        <div class="chat-message">
          <div class="chat-message-inner">
            ${this.chatField.value}
          </div>
        </div>
        <img class="chat-avatar avatar-tiny" src="${this.avatar}">
      </div>
    `)
		)

		this.chatLog.scrollTop = this.chatLog.scrollHeight
		this.chatField.value = ''
		this.chatField.focus()
	}

	hideChat() {
		this.chatWrapper.classList.remove('chat--visible')
	}

	showChat() {
		if (!this.openedYet) {
			// only connect to the server at the very first time showChat()
			this.openConnection()
		}
		this.openedYet = true
		this.chatWrapper.classList.add('chat--visible')
		this.chatField.focus()
	}

	openConnection() {
		// io() will open a connection between the browser and the server
		// keep it in this.socket, so cna access it later on
		this.socket = io()

		this.socket.on('welcome', data => {
			this.username = data.username
			this.avatar = data.avatar
		})

		// the event emit form server
		// socket.broadcast.emit('chatMessageFromServer', data)
		this.socket.on('chatMessageFromServer', data => {
			this.displayMessageFromServer(data)
		})
	}

	displayMessageFromServer(data) {
		this.chatLog.insertAdjacentHTML(
			'beforeend',
			DOMPurify.sanitize(`
			<div class="chat-other">
					<a href="/profile/${data.username}">
						<img class="avatar-tiny" src="${data.avatar}"></a>
					<div class="chat-message">
						<div class="chat-message-inner">
							<a href="/profile/${data.username}"><strong>${data.username}:</strong></a>
							${data.message}
						</div>
				</div>
			</div>
    `)
		)
		this.chatLog.scrollTop = this.chatLog.scrollHeight
	}

	injectHTML() {
		this.chatWrapper.innerHTML = `
    <div class="chat-title-bar">
			Chat <span class="chat-title-bar-close">
			<i class="fas fa-times-circle"></i></span>
		</div>
    <div id="chat" class="chat-log"></div>
    
    <form id="chatForm" class="chat-form border-top">
      <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
    </form>
    `
	}
}
