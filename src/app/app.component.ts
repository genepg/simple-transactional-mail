import { Component } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public afAuth: AngularFireAuth, private fun: AngularFireFunctions) { }

  loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    this.afAuth.auth.signInWithPopup(provider);
  }

  sendEmail() {
    const callable = this.fun.httpsCallable('genericEmail');
    callable({
      subject: 'Email from Angular',
      name: 'XXX',
      text: 'Sending email with Angular and SendGrid is fun!'
    }).subscribe(res => {
      console.log('res', res);
    });
  }
}
