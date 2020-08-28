{
  var Modal = class {
    constructor (selector_or_path, options={}) {
      // {inDOMwhenHidden=true, rememberSizePlace=true, onshow, onhide, fillcb,
      //  top, left, width, height}
      Object.assign(this, options, {onready: []})
      if (this.inDOMwhenHidden === undefined)  this.inDOMwhenHidden = true
      if (this.rememberSizePlace === undefined)  this.rememberSizePlace = true

      try {
        this.protoModal = document.querySelector(selector_or_path)
        if (!this.protoModal) throw 'element not found'
        adoptSizePlace.call(this)
        this.protoModal.remove()

        if (this.inDOMwhenHidden) this.build()
        
        if (selector_or_path == 'body>:first-child')
          document.body.onclick = e => {
            if (e.target != e.currentTarget) return
            this.show()
            this.modal.dataset.top = e.y
            this.modal.dataset.left = e.x
            this.updatePosition()
          }

      } catch (err) {
        parseLayoutFile(selector_or_path).then(({style, modal}) => {
          if (style) document.head.append(style)
          this.protoModal = modal
          adoptSizePlace.call(this)

          if (this.inDOMwhenHidden) this.build()
          this.onready.splice(0).forEach(fn => fn())
          
        })
      }

      document.head.append(baseStyle)
    }

    build() {
      if (!this.protoModal) return this.onready.push(() => this.build())

      if (this.glass) this.glass.remove()

      this.glass = document.createElement('div')
      this.modal = this.protoModal.cloneNode(true)
      this.glass.append(this.modal)
      document.body.append(this.glass)
      Object.assign(this.glass, {className: 'Modal-glass', hidden: true})
  
      this.glass.addEventListener('click', e => {
        if (e.target == e.currentTarget)  this.hide()
      })

      const handleMove = e => {
        const {top, left} = this.modal.getBoundingClientRect()
        this.modal.dataset.top = top + e.movementY
        this.modal.dataset.left = left + e.movementX
        this.updatePosition()
      }

      const handleStop = function () {
        this.removeEventListener('mousemove', handleMove)
        this.removeEventListener('mouseup', handleStop)
      }

      this.modal.addEventListener('mousedown', e => {
        if (e.path.some(el => 
          'INPUT,SELECT,TEXTAREA,BUTTON'.includes(el.tagName))) return      

        document.body.addEventListener('mousemove', handleMove)
        document.body.addEventListener('mouseup', handleStop)
      })

      this.handleResize = () => this.updatePosition()
      addEventListener('resize', this.handleResize)
    }

    updatePosition() {
      if (!this.modal) return

      calcSizePlace(...cssVarNames.map(name => +this.modal.dataset[name]))
        .forEach((value, i) => this.modal.style
          .setProperty(`--${cssVarNames[i]}`, `${value}px`))
    } 

    show() {
      if (!this.protoModal) return this.onready.push(() => this.show())

      if (!this.glass)  this.build()
      else if (!this.rememberSizePlace)
        copySizePlace(this.protoModal, this.modal)
      this.glass.hidden = false

      this.updatePosition()
      if (this.onshow)  this.onshow()
    }

    hide() {
      if (!this.glass) return
      
      if (this.onhide)  this.onhide()
      this.glass.hidden = true
      
      if (!this.inDOMwhenHidden) {
        if (this.rememberSizePlace)
          copySizePlace(this.modal, this.protoModal)
        this.glass.remove()
        delete this.glass
        delete this.modal
        removeEventListener('resize', this.handleResize)
      }
    }

    fill(data) {
      if (!this.protoModal) return this.onready.push(() => this.fill(data))

      if (!this.fillcb) return console.error('No fill callback provided')

      this.fillcb(this.modal || this.protoModal, data)
    }
  }


  const cssVarNames = ['top', 'left', 'width', 'height']
    
  const calcSizePlace = (top, left, width, height) => {
    if (innerWidth < width)  width = innerWidth
    if (innerHeight < height)  height = innerHeight
    if (top + height > innerHeight)  top = innerHeight - height
    if (left + width > innerWidth)  left = innerWidth - width
    if (top < 0)  top = 0
    if (left < 0)  left = 0
    return [top, left, width, height]
  }

  const adoptSizePlace = function () {
    cssVarNames.forEach(name => {
      if (typeof this[name] === 'number') 
        this.protoModal.dataset[name] = this[name]
    })
  }

  const copySizePlace = (from, to) =>
    cssVarNames.forEach(name => to.dataset[name] = from.dataset[name])

  const parseLayoutFile = path => fetch(path).then(resp => resp.text())
    .then(html => {
      const div = document.createElement('div')
      div.innerHTML = html
      const style = div.querySelector('style')
      const modal = [...div.children].find(el => 
        !'META,TITLE,LINK,SCRIPT,STYLE'.includes(el.tagName))
      return {style, modal}
    })

  const baseStyle = document.createElement('style')
  {
    baseStyle.innerHTML = /* css */ `
      body {
        height: 100vh;
        margin: 0;
      }

      .Modal-glass {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #8883;
      }

      .Modal-glass>* {
        position: absolute;
        top: var(--top);
        left: var(--left);
        width: var(--width);
        height: var(--height);
        box-sizing: border-box;
      }

      [hidden] {
        display: none !important;
      }
    `
  }  

  if (document.body) {
    new Modal('body>:first-child')
  }
  
}
/* 

Вызов конструктора
  Попытаться найти элемент по селектору
  Если найден
    
  Иначе
    Попытаться скачать html или htm
 */

 /* 
  
  
  modal layout file (.html or .htm)
    - is not supposed to include script or link tags - they will be ignored when layout is imported, they of course do work normally if you just start this file so <script src="/Modal.js" defer></script> will help you test the modal in solo mode 
    - is supposed to have one child tag in the body which will become the modal and other body children will be ignored
    - can include one style tag in the head with css, other style tags will be ignored too, and it's highly recommended that selectors from that one style tag are all localized to that one body child by id and/or class - so they won't erroneously apply to something else upon inclusion into other page
 
 */