import Vue from 'vue'
import Notepad from './Notepad.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Notepad),
}).$mount('#app')
