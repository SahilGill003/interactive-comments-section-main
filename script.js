class Model {
  constructor(data) {
    this.data = data
    this.votes = []
    this.id = 1
    this.data.comments.forEach((comment) => {
      this.id++
      this.id += comment.replies?.length
    })
  }

  addComment = (comment) => {
    comment.id = this.id++
    comment.user = this.data.currentUser
    comment.createdAt = 'now'
    this.data.comments.push(comment)
  }

  replyToComment(id, commentReply) {
    commentReply.content = commentReply.content.trim()
    const reply = {
      id: this.id++,
      user: this.data.currentUser,
      createdAt: 'now',
      ...commentReply,
    }

    let replyingTo = ''
    if (reply.content[0] === '@') {
      let pos = reply.content.length
      for (let i = 1; i < reply.content.length; i++) {
        if (
          (reply.content[i] >= 'a' && reply.content[i] <= 'z') ||
          reply.content[i] === '_'
        ) {
          replyingTo += reply.content[i]
        } else {
          pos = i
          break
        }
      }
      reply.content = reply.content.substr(pos)
    }
    reply.replyingTo = replyingTo

    this.data.comments.forEach((comment) => {
      comment.replies?.forEach((rp) => {
        if (rp.id === id) {
          if (!reply.replyingTo) reply.replyingTo = rp.user.username
          comment.replies.push(reply)
          return
        }
      })
      if (comment.id === id) {
        comment.replies.push(reply)
      }
    })
    return reply
  }

  editComment(id, newcontent) {
    for (const comment of this.data.comments) {
      if (comment.id == id) {
        comment.content = newcontent
        return comment
      }
      if (comment.replies) {
        for (const reply of comment.replies) {
          if (reply.id == id) {
            reply.content = newcontent
            reply.replyingTo = ''
            if (reply.content[0] === '@') {
              let pos = reply.content.length
              for (let i = 1; i < reply.content.length; i++) {
                if (
                  (reply.content[i] >= 'a' && reply.content[i] <= 'z') ||
                  reply.content[i] === '_'
                ) {
                  reply.replyingTo += reply.content[i]
                } else {
                  pos = i
                  break
                }
              }
              reply.content = reply.content.substr(pos)
            }
            return reply
          }
        }
      }
    }
  }

  deleteComment(id) {
    this.data.comments = this.data.comments.filter((comment) => {
      comment.replies = comment.replies?.filter((reply) => reply.id !== id)
      return comment.id !== id
    })
  }

  upvoteComment(id) {
    this.data.comments.forEach((comment) => {
      if (comment.id === id) comment.score++
      comment.replies?.forEach((reply) => {
        if (reply.id === id) {
          reply.score++
        }
      })
    })
    this.votes.push(id)
  }

  downvoteComment(id) {
    this.data.comments.forEach((comment) => {
      if (comment.id === id) comment.score--
      comment.replies?.forEach((reply) => {
        if (reply.id === id) {
          reply.score--
        }
      })
    })
    this.votes.push(id)
  }

  bindCommentsChanged(callback) {
    this.onCommentsChanged = callback
  }
}

class View {
  constructor() {
    this.app = this.getElement('#root')

    this.comments = this.createElement('div', ['interactive-comment-section'])

    this.form = this.createElement('form', ['add_comment_form'])

    this.textarea = this.createElement('textarea')
    this.textarea.placeholder = 'Add a Comment... '

    this.userimg = this.createElement('img', ['user_img'])

    this.submit = this.createElement('button', ['add-comment', 'primary_btn'])
    this.submit.type = 'submit'
    this.submit.textContent = 'Send'

    this.form.append(this.textarea, this.userimg, this.submit)

    this.modal = this.createElement('div', ['modal'])
    this.modal.classList.toggle('hidden')
    this.modal.id = 'abc'
    this.modalcontent = this.createElement('div', ['modalcontent'])
    this.modalheading = this.createElement('h2', ['modalheading'])
    this.modalheading.textContent = 'Delete Comment'
    this.modaltext = this.createElement('p')
    this.modaltext.textContent =
      "Are you sure you want to delete this comment? This will remove the comment and can't be undone."
    this.modalconfirm = this.createElement('button', ['confirm', 'primary_btn'])
    this.modalconfirm.textContent = 'Yes, Delete'
    this.modaldiscard = this.createElement('button', ['discard', 'primary_btn'])
    this.modaldiscard.textContent = 'No, Cancel'
    this.modalcontent.append(
      this.modalheading,
      this.modaltext,
      this.modaldiscard,
      this.modalconfirm,
    )
    this.modal.append(this.modalcontent)

    this.app.append(this.comments, this.form, this.modal)
  }

  createElement(tag, classNames) {
    const element = document.createElement(tag)
    if (classNames) element.classList.add(...classNames)
    return element
  }

  getElement(selector) {
    const element = document.querySelector(selector)
    return element
  }

  createScoreCard(score) {
    const scorecard = this.createElement('div', ['score_card'])
    const scoretext = this.createElement('span')
    scoretext.append(score)
    const upvote = this.createElement('button', ['upvote_btn'])
    const upimg = this.createElement('img')
    upvote.append(upimg)
    upimg.src = './images/icon-plus.svg'
    const downvote = this.createElement('button', ['downvote_btn'])
    const downimg = this.createElement('img')
    downvote.append(downimg)
    downimg.src = './images/icon-minus.svg'
    scorecard.append(upvote, scoretext, downvote)
    return scorecard
  }

  createReplyForm(replyingTo) {
    const form = this.createElement('form', ['reply_form', 'hidden'])
    const textarea = this.createElement('div', ['replying'])
    textarea.setAttribute('contenteditable', 'true')
    textarea.focus({ focusVisible: true })
    textarea.innerHTML = `@${replyingTo}`

    const replys = this.createElement('button', ['submit_reply', 'primary_btn'])
    replys.type = 'submit'
    replys.textContent = 'reply'
    form.append(this.userimg.cloneNode(), textarea, replys)
    return form
  }

  createCommentContent(comment, isCurrentUser) {
    const msg = this.createElement('div', ['content'])
    const span = this.createElement('span')
    span.textContent = comment.content

    if (comment.replyingTo) {
      const span = this.createElement('span', ['at_span'])
      span.textContent = `@${comment.replyingTo} `
      msg.append(span)
    }
    msg.append(span)

    if (isCurrentUser) msg.setAttribute('contenteditable', 'false')
    return msg
  }

  handleCreateCommentTime(createdAt) {
    let time = 0
    setInterval(() => {
      if (!createdAt) {
        return
      }
      time++
      if (time <= 60) {
        const text = 'now'
        if (createdAt.textContent !== text) {
          createdAt.textContent = text
        }
      } else if (time >= 60 && time <= 3600) {
        const t = Number(time / 60).toFixed(0)
        const text = `${t} ${'minute' + (t <= 1 ? '' : 's')} ago`
        if (createdAt.textContent !== text) {
          createdAt.textContent = text
        }
      } else if (time >= 3600 && time <= 12 * 3600) {
        const t = Number(time / 3600).toFixed(0)
        const text = `${t} ${'hour' + (t <= 1 ? '' : 's')} ago`
        if (createdAt.textContent !== text) {
          createdAt.textContent = text
        }
      } else if (time >= 3600 * 12 && time <= 3600 * 24) {
        const t = Number(time / (12 * 3600)).toFixed(0)
        const text = `${t} ${'day' + (t <= 1 ? '' : 's')} ago`
        if (createdAt.textContent !== text) {
          createdAt.textContent = text
        }
      } else if (time >= 7 * 24 * 3600 && time <= 30 * 24 * 3600) {
        const t = Number(time / (7 * 12 * 3600)).toFixed(0)
        const text = `${t} ${'week' + (t <= 1 ? '' : 's')} ago`
        if (createdAt.textContent !== text) {
          createdAt.textContent = text
        }
      } else if (time >= 30 * 24 * 3600 && time <= 12 * 30 * 24 * 3600) {
        const t = Number(time / (30 * 12 * 3600)).toFixed(0)
        const text = `${t} ${'month' + (t <= 1 ? '' : 's')} ago`
        if (createdAt.textContent !== text) {
          createdAt.textContent = text
        }
      } else if (time >= 12 * 30 * 24 * 3600) {
        const t = Number(time / (24 * 30 * 12 * 3600)).toFixed(0)
        const text = `${t} ${'year' + (t <= 1 ? '' : 's')} ago`
        if (createdAt.textContent !== text) {
          createdAt.textContent = text
        }
      }
    }, 1000)
  }

  createComment(comment, isCurrentUser = false) {
    const div = this.createElement('div', ['comment-section'])
    div.setAttribute('data-id', comment.id)

    const commentdiv = this.createElement('div', ['comment'])
    const profile = this.createElement('div', ['flex', 'profile'])
    const img = this.createElement('img')
    console.log(comment)
    img.src = comment.user.image.png

    const username = this.createElement('span', ['profile_username'])
    username.textContent = comment.user.username

    profile.append(img, username)

    if (isCurrentUser) {
      const tag = this.createElement('span', ['profile_tag'])
      tag.textContent = 'you'
      profile.append(tag)
    }

    const createdAt = this.createElement('span', ['created_at'])
    createdAt.textContent = comment.createdAt
    if (createdAt.textContent === 'now') {
      this.handleCreateCommentTime(createdAt)
    }

    profile.append(createdAt)

    const scorecard = this.createScoreCard(comment.score)

    const content = this.createCommentContent(comment, isCurrentUser)
    commentdiv.append(profile, scorecard, content)

    const actions = this.createElement('div', ['actions'])

    if (isCurrentUser) {
      const editdiv = this.createElement('div', ['edit'])
      const editimg = this.createElement('img')
      editimg.src = './images/icon-edit.svg'
      const editbutton = this.createElement('button', ['edit_btn'])
      editbutton.textContent = 'edit'
      editdiv.append(editimg, editbutton)

      const updatediv = this.createElement('div', ['update', 'hidden'])
      const updatebutton = this.createElement('button', [
        'update_btn',
        'primary_btn',
      ])
      updatebutton.textContent = 'update'
      updatediv.append(updatebutton)

      const deletediv = this.createElement('div', ['delete'])
      const deleteimg = this.createElement('img')
      deleteimg.src = './images/icon-delete.svg'
      const deletebutton = this.createElement('button', ['delete_btn'])
      deletebutton.setAttribute('popovertarget', 'abc')
      deletebutton.textContent = 'delete'

      deletediv.append(deleteimg, deletebutton, this.modal.cloneNode())

      actions.append(deletediv, editdiv, updatediv)
    } else {
      const replyEl = this.createElement('div', ['reply'])
      const replyimg = this.createElement('img')
      replyimg.src = './images/icon-reply.svg'

      const replybutton = this.createElement('button', ['reply_btn'])
      replybutton.textContent = 'reply'

      replyEl.append(replyimg, replybutton)

      actions.append(replyEl)
    }
    commentdiv.append(actions)
    div.append(commentdiv)
    div.append(this.createReplyForm(comment.user.username))
    return div
  }

  displayReplyArea(commentEl) {
    commentEl.querySelector('.reply_form').classList.remove('hidden')
    commentEl.querySelector('.replying').focus()
  }

  displayComments(comments, isCurrentUser) {
    const fragment = document.createDocumentFragment()
    for (const comment of comments) {
      const commentEl = this.createComment(comment, isCurrentUser(comment.user))
      for (const reply of comment.replies) {
        commentEl.append(this.createComment(reply, isCurrentUser(reply.user)))
      }
      fragment.append(commentEl)
    }
    this.comments.append(fragment)
  }

  editComment(id) {
    const sel = `[data-id='${id}']>.comment>.content`
    document.querySelector(sel).setAttribute('contenteditable', 'true')
    document.querySelector(sel).focus()
  }

  getCommentContent(id) {
    const sel = `[data-id='${id}']>.comment>.content`
    document.querySelector(sel).setAttribute('contenteditable', 'false')
    return document.querySelector(sel).textContent
  }

  bindCloseModal(id, handler) {
    this.modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('confirm')) {
        this.modal.classList.add('hidden')
        document.body.style.overflow = 'scroll'
        handler(id)
      } else if (e.target.classList.contains('discard')) {
        this.modal.classList.add('hidden')
        document.body.style.overflow = 'scroll'
        return
      }
    })
  }

  bindDisplayReplyArea(handler) {
    this.comments.addEventListener('click', (e) => {
      if (e.target.classList.contains('reply_btn')) {
        handler(e.target.closest('[data-id]'))
      }
    })
  }

  bindAddComment(handler) {
    this.getElement('.add-comment').addEventListener('click', (e) => {
      e.preventDefault()
      if (!this.textarea.value) return
      const comment = {
        content: this.textarea.value,
        score: 0,
        replies: [],
      }
      handler(comment)
      this.textarea.value = ''
    })
  }

  bindReplyToComment(handler) {
    this.comments.addEventListener('click', (e) => {
      if (e.target.classList.contains('submit_reply')) {
        e.preventDefault()
        e.target.closest('.reply_form').classList.add('hidden')
        const commentEl = e.target.closest('[data-id]')
        let id = parseInt(commentEl.getAttribute('data-id'))
        if (commentEl.parentElement.closest('[data-id]')) {
          id = parseInt(
            commentEl.parentElement
              .closest('[data-id]')
              .getAttribute('data-id'),
          )
        }

        const comment = {}
        comment.content = commentEl.querySelector('.replying').textContent
        comment.score = 0

        handler(id, comment)
      }
    })
  }

  bindEditComment(handler) {
    this.comments.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit_btn')) {
        console.log(e.target.parentElement)
        e.target.parentElement.classList.add('hidden')
        const id = parseInt(
          e.target.closest('[data-id]').getAttribute('data-id'),
        )
        e.target
          .closest('[data-id]')
          .querySelector('.update')
          .classList.remove('hidden')
        handler(id)
      }
    })
  }

  bindUpdateComment(handler) {
    this.comments.addEventListener('click', (e) => {
      if (e.target.classList.contains('update_btn')) {
        e.target.parentElement.classList.add('hidden')
        const id = parseInt(
          e.target.closest('[data-id]').getAttribute('data-id'),
        )
        e.target
          .closest('[data-id]')
          .querySelector('.edit')
          .classList.remove('hidden')
        handler(id)
      }
    })
  }

  bindDeleteComment(handler) {
    this.comments.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete_btn')) {
        const id = parseInt(
          e.target.closest('[data-id]').getAttribute('data-id'),
        )
        this.modal.classList.remove('hidden')
        document.body.style.overflow = 'clip'
        handler(id)
      }
    })
  }

  bindUpvoteComment(handler) {
    this.comments.addEventListener('click', (e) => {
      e.preventDefault()
      if (e.target.closest('.upvote_btn')) {
        const id = parseInt(
          e.target.closest('[data-id]').getAttribute('data-id'),
        )
        handler(id)
      }
    })
  }

  bindDownvoteComment(handler) {
    this.comments.addEventListener('click', (e) => {
      e.preventDefault()
      if (e.target.closest('.downvote_btn')) {
        const id = parseInt(
          e.target.closest('[data-id]').getAttribute('data-id'),
        )
        handler(id)
      }
    })
  }
}

class Controller {
  constructor(model, view) {
    this.model = model
    this.view = view
  }

  init() {
    this.view.userimg.src = this.model.data.currentUser.image.png
    this.view.bindAddComment(this.handleAddComment)
    this.view.bindDisplayReplyArea(this.handleDisplayReplyArea)
    this.view.bindReplyToComment(this.handleReplyToComment)
    this.view.bindDeleteComment(this.handleCloseModal)
    this.view.bindUpvoteComment(this.handleUpvoteComment)
    this.view.bindDownvoteComment(this.handleDownvoteComment)
    this.view.bindEditComment(this.handleEditComment)
    this.view.bindUpdateComment(this.handleUpdateComment)
    this.handleDisplayComments()
  }

  handleAddComment = (comment) => {
    this.model.addComment(comment)

    const newComment = this.view.createComment(
      comment,
      (user) => user.username === this.model.data.currentUser.username,
    )

    this.view.comments.append(newComment)
    this.view.textarea.value = ''
  }

  handleDeleteComment = (id) => {
    this.model.deleteComment(id)

    const commentEl = document.querySelector(`[data-id='${id}']`)

    if (commentEl) commentEl.remove()
  }

  handleCloseModal = (id) => {
    this.view.bindCloseModal(id, this.handleDeleteComment)
  }

  handleDisplayReplyArea = (commentEl) => {
    this.view.displayReplyArea(commentEl)
  }

  handleReplyToComment = (comment_id, reply) => {
    let newReply = this.model.replyToComment(comment_id, reply)
    console.log(newReply)

    const parentCommentEl = document.querySelector(`[data-id='${comment_id}']`)

    if (parentCommentEl) {
      const newReplyEl = this.view.createComment(
        newReply,
        (user) => user.username === this.model.data.currentUser.username,
      )
      parentCommentEl.append(newReplyEl)
    }
  }

  handleDisplayComments = () => {
    this.view.displayComments(
      this.model.data.comments,
      (user) => user.username === this.model.data.currentUser.username,
    )
  }

  handleEditComment = (id) => {
    this.view.editComment(id)
  }

  handleUpdateComment = (id) => {
    const updatedContent = this.view.getCommentContent(id)

    const updatedComment = this.model.editComment(id, updatedContent)

    const newCommentEl = this.view.createCommentContent(
      updatedComment,
      (user) => user.username === this.model.data.currentUser.username,
    )

    const commentEl = document.querySelector(`[data-id='${id}'] .content`)

    if (commentEl) {
      commentEl.replaceWith(newCommentEl)
    }
  }

  handleUpvoteComment = (id) => {
    if (this.model.votes.includes(id)) return

    this.model.upvoteComment(id)

    const scoreEl = document.querySelector(`[data-id='${id}'] .score_card span`)

    if (scoreEl) {
      scoreEl.textContent = parseInt(scoreEl.textContent) + 1
    }
  }

  handleDownvoteComment = (id) => {
    if (this.model.votes.includes(id)) return
    this.model.downvoteComment(id)

    const scoreEl = document.querySelector(`[data-id='${id}'] .score_card span`)

    if (scoreEl) {
      scoreEl.textContent = parseInt(scoreEl.textContent) - 1
    }
  }
}

async function init() {
  const data = await fetch('./data.json')
  const json = await data.json()
  const app = new Controller(new Model(json), new View())
  app.init()
}

document.addEventListener('DOMContentLoaded', () => {
  init()
})
