Parse.initialize("byj9WPuVXVPlXZ9X39CBZHHM9UpOXgrZv8IbPiGU", "yUbSE0GkcepzIDh40CS87vxn9gixCCmXjCpSk7Fh");

elem = {
  application: document.getElementById("application"),
  form: {
    register: {
      email: document.getElementById("formRegisterEmail"),
      password: document.getElementById("formRegisterPassword")
    },
    signIn: {
      email: document.getElementById("formSignInEmail"),
      password: document.getElementById("formSignInPassword")
    },
    ask: {
      file: document.getElementById("formAskQuestionImage"),
      question: document.getElementById("formAskQuestionQuestion"),
      // points: document.getElementById("formAskQuestionPoints")
    }
  }
}

var Question = Parse.Object.extend("Question");

var questions = new Parse.Query(Question);
if (localStorage.getItem('answers') === null) {
  localStorage.setItem('answers', JSON.stringify([]));
  answers = [];
} else {
  answers = JSON.parse(localStorage.getItem('answers'));
}

questions.find({
  success: function(results) {
    results.sort(function(q1, q2) {
      return (q1.get("yes") + q1.get("no")) - (q2.get("yes") + q2.get("no"));
    });
    application = new function() {
      this.user = Parse.User.current(),
      //this.points = this.user === null ? 0 : this.user.get("points");
      this.views = {
          'answer': true,
      };
      this.allDone = false;
      this.questions = results;
      this.questionIndex = -1;
      this.question = {};
      this.ask = ask;
      this.register = register;
      this.signIn = signIn;
      this.signOut = signOut;
      this.updateView = updateView;
      this.yes = yes;
      this.no = no;
    }
    rivets.bind(elem.application, application);
    nextQuestion();

  },
  error: function(error) {
    console.log(error);
  }
});

function register() {
  var user = new Parse.User();
  user.set("username", elem.form.register.email.value.toLowerCase());
  user.set("email", elem.form.register.email.value.toLowerCase());
  user.set("password", elem.form.register.password.value);
  // user.set("points", application.points);

  user.signUp(null, {
    success: function(user) {
      application.user = user;
      setView("answer");
    },
    error: function(user, error) {
      // Show the error message somewhere and let the user try again.
      alert("Error: " + error.code + " " + error.message);
    }
  });
}

function signIn() {
  Parse.User.logIn(elem.form.signIn.email.value.toLowerCase(), elem.form.signIn.password.value, {
    success: function(user) {
      console.log(user);
      application.user = user;
      setView("answer");
    },
    error: function(user, error) {
      // Show the error message somewhere and let the user try again.
      alert("Error: " + error.code + " " + error.message);
    }
  });
}

function signOut() {
  Parse.User.logOut();
  application.user = Parse.User.current();
  setView("answer");
}

function ask() {
  var file = elem.form.ask.file.files[0];
  var imageType = /image.*/;

  question = new Question();
  file = new Parse.File("questionImage", file);
  question.set("user", Parse.User.current());
  question.set("question", elem.form.ask.question.value);
  question.set("yes", 0);
  question.set("no", 0);
  question.set("file", file);
  question.save(null, {
    success: function(question) {
      setView("menu")
      elem.form.ask.file.value = '';
      elem.form.ask.question.value = '';
    },
    error: function(question, error) {
      console.log(question, error);
    }
  });
}

function updateView() {
  setView(this.attributes["data-view"].value);
}

function setView(view) {
  views = Object.keys(application.views);
  if (view === "menu") {
    var query = new Parse.Query(Question);
    query.equalTo("user", Parse.User.current());
    query.find({
      success: function(results) {
        results = results.map(function(question) {
          // rivets and parse dont like each other
          return {
            question: question.get("question"),
            file: question.get("file")._url,
            yes: question.get("yes"),
            no: question.get("no")
          }
        });
        application.myQuestions = results;
      },
      error: function(error) {
        alert("Error: " + error.code + " " + error.message);
      }
    });
  }
  for (var i = 0; i < views.length; i++) {
    application.views[views[i]] = views[i] === view;
  }
}

function addId(id) {
  answers.push(id);
  localStorage.setItem("answers", JSON.stringify(answers));
}

function yes() {
  question = application.questions[application.questionIndex];
  question.increment("yes");
  question.save();
  addId(question.id);
  nextQuestion();
}

function no() {
  question = application.questions[application.questionIndex];
  question.increment("no");
  question.save();
  addId(question.id);
  nextQuestion();
}

function nextQuestion() {
  application.questionIndex += 1;
  if (application.questionIndex >= application.questions.length) {
    application.allDone = true;
  } else {
    application.question.file = application.questions[application.questionIndex].get("file")._url;
    application.question.question = application.questions[application.questionIndex].get("question");
    if (answers.indexOf(application.questions[application.questionIndex].id) !== -1) {
      nextQuestion();
    }
  }
}
