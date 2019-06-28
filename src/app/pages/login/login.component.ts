import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private authService: AuthService) { }

  ngOnInit() {
  }

  signInWithGoogle() {
    this.authService.signInWithGoogle().then(response => {
      console.log(response);
    }).catch(error => {
      console.log(error);
    });
  }

  signInWithFacebook() {
    this.authService.signInWithFacebook().then(response => {
      console.log(response);
    }).catch(error => {
      console.log(error);
    });
  }
}
