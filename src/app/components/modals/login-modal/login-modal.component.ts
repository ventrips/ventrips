import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/firestore/auth/auth.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss']
})
export class LoginModalComponent implements OnInit {

  constructor(
    private authService: AuthService,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit() {
  }

  signInWithGoogle() {
    this.authService.signInWithGoogle().then((response) => {
      this.activeModal.close();
    });
  }

  signInWithFacebook() {
    this.authService.signInWithFacebook().then((response) => {
      this.activeModal.close();
    });
  }
}
