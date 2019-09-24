import Vue from 'vue'
import Layouts from './Layouts.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Layouts),
}).$mount('#app')
