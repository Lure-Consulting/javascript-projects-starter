import App from './app.pug'

const app = new App({
  target: document.body,
  data: {name: 'world'}
})

// change the data associated with the template
setTimeout(() => {
  app.set({name: 'everybody'})
}, 5000)

