import Vue from 'vue'
import Settings from './Settings.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Settings),
}).$mount('#app')
