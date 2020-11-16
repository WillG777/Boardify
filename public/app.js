const qs = e=>document.querySelector(e);
const qsa = e=>document.querySelectorAll(e);
const pick = (...props) => o => props.reduce((a, e) => ({ ...a, [e]: o[e] }), {}); // TODO use this
// works like pick('prop1', 'prop2')(obj)
// from https://stackoverflow.com/questions/17781472/how-to-get-a-subset-of-a-javascript-objects-properties

const baseUrl = 'http://localhost:4001'

Vue.component('player-info', {
  template: `
    <table class="player">
    <tr><th contenteditable>{{name}}</th></tr>
    <tr><td contenteditable>{{info}}</td></tr>
    </table>
  `,
  props: ['name', 'info']
});

Vue.component('card-adder', {
  template: `
    <div class="cardAdder">
      Type:
      <input type="radio" value="text" v-model="card.type"><label>Text</label>
      <input type="radio" value="image" v-model="card.type"><label>Image</label>
      <div v-if="card.type === 'image'">
        Front: <input type="file" accept="image/*" @change="uploadImage($event, true)"><br>
        Back: <input type="file" accept="image/*" @change="uploadImage($event, false)">
      </div>
      <div v-if="card.type === 'text'">
        Front: <input type="text" v-model="card.frontText" @blur="updateCard"><br>
        Back: <input type="text" v-model="card.backText" @blur="updateCard">
      </div>
    </div>
  `,
  props: {
    deckId: {type: Number, required: true},
    type: {type: String, default: 'image'},
    frontImage: {type: String, default: ''},
    backImage: {type: String, default: ''},
    frontText: {type: String, default: ''},
    backText: {type: String, default: ''},
    index: {type: Number, required: true}
  },
  data() {return {
    card: {
      type: this.type,
      frontImage: this.frontImage,
      backImage: this.backImage,
      frontText: this.frontText,
      backText: this.backText
    }
  }},
  methods: {
    updateCard() {
      this.$parent.cards[this.index] = this.card
    },
    uploadImage(e, isFront) { // TODO combine with app image methods
      var files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;
      const file = files[0];
      var image = new Image();
      var reader = new FileReader();
      var vm = this.card;
      reader.onload = e => {
        if (isFront) {
          vm.frontImage = e.target.result;
        } else {
          vm.backImage = e.target.result;
        }
        this.updateCard();
      };
      reader.readAsDataURL(file);
    }
  }

});

Vue.component('deck-editor', {
  template: `
    <div class="deckEditor">
      <button @click="active = true" v-if="!active">Edit Deck: {{name || 'New Deck'}}</button>
      <div v-if="active">
        <label for="deckName">Deck name: </label><input type="text" id="deckName" v-model="name"><br>
        <label for="cardWidth">Card width: </label><input type="number" id="cardWidth" v-model="cardWidth">
        <label for="cardHeight">Card height: </label><input type="number" id="cardHeight" v-model="cardHeight"><br>
        <card-adder :deck-id="deckId" v-for="(card, index) in cards" v-bind="card" :key="index" :index="index"></card-adder>
        <button @click="newCard">New Card</button>
        <button @click="closeDeck">Done</button>
      </div>
    </div>
  `,
  props: {deckId: {type: Number, default: 0}},
  data() {return {
    cards: [],
    name: '',
    active: false,
    cardWidth: 200,
    cardHeight: 320
  }},
  methods: {
    closeDeck() {
      this.$root.decks[this.deckId] = {
        cards: this.cards,
        name: this.name,
        cardWidth: this.cardWidth,
        cardHeight: this.cardHeight
      };
      this.active = false;
    },
    newCard() {
      this.cards.push({ // TODO make a Card class for less copy/pasted code
        type: 'image',
        frontImage: '',
        backImage: '',
        frontText: '',
        backText: ''
      });
    }
  }
});

Vue.component('deck-user', {
  template: `
    <div class="deckUser">
      <button v-if="!active" @click="active=true">Use Deck: {{deckName}}</button>
      <div v-if="active">
        <p>Actions for deck: {{deckName}}</p>
        <button @click="shuffle">Shuffle</button>
        <button @click="dealUpCard">Deal Up Card</button>
        <button @click="dealDownCard">Deal Down Card</button>
        <button @click="active=false">Done</button>
      </div>
    </div>
  `,
  props: {deckId: {type: Number, required: true}},
  data() {return {
    active: false,
    cardIndex: 0
  }},
  computed: {
    deckName() {return this.$root.decks[this.deckId].name}
  },
  methods: {
    shuffle() {
      this.$root.decks[this.deckId].cards = shuffle(this.$root.decks[this.deckId].cards);
    },
    dealUpCard() {
      const deck = this.$root.decks[this.deckId];
      const card = deck.cards[this.cardIndex++];
      if (card.type === 'image')
        fabric.Image.fromURL(card.frontImage, img => {
          img.set({left: 0, top: 0});
          img.scaleToHeight(deck.cardHeight);
          window.canvas.add(img);
        });
      else if (card.type === 'text') {
        let text = new fabric.Text(card.frontText, {
          hasBorders: true,
          borderColor: 'black',
          padding: deck.cardHeight / 2
        });
        window.canvas.add(text)
      }
    },
    dealDownCard() {
      const deck = this.$root.decks[this.deckId];
      const card = deck.cards[this.cardIndex++];
      fabric.Image.fromURL(card.frontImage, img => {
        img.set({left: 0, top: 0});
        img.scaleToHeight(deck.cardHeight);
        window.secret.add(img);
      });
    }
  }
});

Vue.component('dice-editor', {
  template: `
    <div class="diceEditor">
      <button v-if="!active" @click="active=true">Edit dice: {{name || 'New Dice'}}</button>
      <div v-if="active">
        Name: <input type="text" v-model="name">
        <select v-model="type">
          <option disabled value="">Select type...</option>
          <option value="number">Numbered range</option>
          <option value="text">Custom text</option>
          <option value="image">Custom images</option>
        </select>
        <div v-if="type === 'number'">
          Min: <input type="number" value=1 v-model="minNum">
          Max: <input type="number" value=6 v-model="maxNum">
        </div>
        <div v-if="type === 'text'">
          Input values separated by commas with no spaces:<br>
          <input type="text" v-model="customText">
        </div>
        <div v-if="type === 'image'">
          Add images for each side:<br>
          <input type="file" accept="image/*" multiple>
        </div>
        <label for="numRepeat">How many of these?</label><input type="number" name="numRepeat" v-model="numRepeat" value=1>
        <button @click="saveDice">Done</button>
      </div>
    </div>
  `,
  props: {diceId: {type: Number, default: 0}},
  data() {return {
    type: '',
    name: '',
    minNum: 1,
    maxNum: 6,
    customText: '',
    numRepeat: 1,
    active: false
  }},
  computed: {
    customArray() {
      return this.customText.split(',')
    }
  },
  methods: {
    saveDice() {
      this.active = false;
      this.$root.dice[this.diceId] = pick('type', 'name', 'minNum', 'maxNum', 'customArray', 'numRepeat')(this);
    }
  }
});

Vue.component('dice-roller', {
  template: `
    <div class="diceRoller">
      <button @click="active=true" v-if="!active">Use dice: {{name || 'New Dice'}}</button>
      <div v-if="active">
        <button @click="rollOnce">Roll once</button>
        <button @click="rollAll">Roll all {{numRepeat}}</button>
      </div>
    </div>
  `,
  props: {
    name: String,
    minNum: Number,
    maxNum: Number,
    numRepeat: Number,
    customArray: Object,
    type: String
  },
  data() {return {
    active: false
  }},
  methods: {
    rollOnce() {
      var result;
      switch(type) {
        case 'number':
          result = parseInt(Math.random()*(this.minNum - this.maxNum + 1)); break;
        case 'text':
          result = this.customArray[parseInt(Math.random()*result.length)]; break;
        case 'image': // TODO implement this
          break;
      }
      let text = new fabric.Text(result, {
        hasBorders: true,
        borderColor: 'black'
      });
      window.canvas.add(text);
    },
    rollAll() {

    }
  }
})

const app = new Vue({
  el: '#app',
  data: {
    players: [ // empty this for finished version
      {name: 'John', info: '$1500'},
      {name: 'Bob', info: '$1200, CT Ave'}
    ],
    roomId: '',
    board: {
      image: '',
      width: 1000, // TODO make this responsive based on screen size
      height: 700
    },
    pieces: [], // array of piece images
    decks: {
      '0': {name: '', cards: []}
    }, // objects of form {name: '', cards: []}
    dice: [{
      type: 'number',
      minNum: 1,
      maxNum: 6,
      name: '1-6',
      numRepeat: 1
    }],
    curDeckId: 0
  },
  methods: {
    addPlayer() {
      this.players.push({name: 'Name Here', info: 'Info Here'})
    },
    createRoom() {
      fetch(baseUrl+'/room', {method: 'POST'})
      .then(res => res.json())
      .then(data => this.roomId = data.room)
    },
    createDeck() {
      // TODO get next deckID from backend
      Vue.set(this.decks, ++this.curDeckId, {name: '', cards: [], cardWidth: 200, cardHeight: 320});
    },
    createDice() {
      dice.push({
        type: 'number',
        minNum: 1,
        maxNum: 6,
        name: '1-6',
        numRepeat: 1
      });
    }
    handleUpload(e, type) {
      var files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;
      this.createImage(files[0], type);
    },
    // from https://codepen.io/Atinux/pen/qOvawK/
    createImage(file, type) {
      var image = new Image();
      var reader = new FileReader();
      var vm = this;

      reader.onload = (e) => {
        switch (type) {
          case 'board':
            vm.board.image = e.target.result;
            fabric.Image.fromURL(vm.board.image, img => {
              img.set({left: 0, top: 0})
              img.scaleToHeight(window.canvas.height);
              window.canvas.add(img);
            });
            break;
          case 'piece':
            vm.pieces.push(e.target.result);
            fabric.Image.fromURL(e.target.result, img => {
              img.set({left: 0, top: 0})
              img.scaleToHeight(100);
              window.canvas.add(img);
            });
            break;
          default:
            console.error('type of image not recognized')
        }
      };
      reader.readAsDataURL(file);
    },
    removeImage(e) {
      this.image = '';
    },
  },
  mounted() {
    window.canvas = new fabric.Canvas('openCanvas');
    window.secret = new fabric.Canvas('secretCanvas');
  }
});

function shuffle(arr) {
  var newArr = [];
  while(arr.length) {
    newArr.push(arr.splice(parseInt(Math.random()*arr.length), 1)[0]);
  }
  return newArr;
}

window.onbeforeunload = e => {
  if(app.roomId) fetch(baseUrl+'/room/'+app.roomId, {
    method: 'DELETE'
  });
}
