// {inDOMwhenHidden=true, rememberSizePlace=true, onshow, onhide, fillcb,
//  top, left, width, height}

const modal1 = new Modal("modal1.html",
  {rememberSizePlace: false})
const modal2 = new Modal("modal2.htm", {
  inDOMwhenHidden: false, rememberSizePlace: true, 
  left: 20, top: 200, width: 500, height: 500,
  onshow: () => console.log('modal in view'),
  onhide: () => console.log('modal out of view'),
  fillcb: (modal, data) => {
    modal.querySelector('textarea').value = data
  }
})

setTimeout(() => {
  modal2.fill('new description RULEZ!')
  modal2.show()
}, 5000)

const [btn1, btn2] = document.querySelectorAll('button')

btn1.onclick = () => modal1.show()
btn2.onclick = () => modal2.show()