import Vue from 'vue'
import Address from './Address.vue'
import { getSearchSuggestions } from './suggestions/suggestions'

Vue.config.productionTip = false

new Vue({
  render: h => h(Address),
}).$mount('#app')
