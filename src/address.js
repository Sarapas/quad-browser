import Vue from 'vue'
import Address from './Address.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Address),
}).$mount('#app')
