import Vue from 'vue'
import Find from './Find.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Find),
}).$mount('#app')
