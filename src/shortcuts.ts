import Vue from 'vue'
import Shortcuts from './Shortcuts.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Shortcuts),
}).$mount('#app')
