<template>
    <div id="app">
        <h1>{{ number }}</h1>
    </div>
</template>

<script>
export default {
  name: 'blank',
  data: function() {
    return {
      number: 5
    };
  },
  methods: {

  },
  mounted: function () {

  }
}
</script>

<style>
#app {
	font-family: 'Avenir', Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
    display: flex;
    flex-direction: column;
	color: #2c3e50;
    height: 95vh;
    margin: 0;
}
body {
    background-color: black;
}
h1 {
    opacity: 0.54;
    margin: 0;
    font-size: 170px;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
}
</style>
