import Vue from 'vue'
import Address from './Address.vue'
import { VuePlugin } from 'vuera'

Vue.config.productionTip = false
Vue.use(VuePlugin)

new Vue({
  render: h => h(Address),
}).$mount('#app')
