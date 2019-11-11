import Vue from 'vue'
import Walkthrough from './Walkthrough.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Walkthrough),
}).$mount('#app')
