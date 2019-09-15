import Vue from 'vue'
import Blank from './Blank.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Blank),
}).$mount('#app')
