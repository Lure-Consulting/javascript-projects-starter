import {app} from 'hyperapp'

import template from './main.pug'

const state = {
  count: 0
}

const actions = {
  down: value => state => ({ count: state.count - value }),
  up: value => state => ({ count: state.count + value })
}

app(state, actions, template, document.body)
