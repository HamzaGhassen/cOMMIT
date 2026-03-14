import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfigService } from '../../services/config-service/app.config.service';
import { AppConfig } from '../../api/appconfig';
import { Subscription } from 'rxjs';
import { Agent } from 'src/shared/Agent';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authenticationService';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  providers: [MessageService],
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit, OnDestroy {

  valCheck: string[] = ['remember'];

  config: AppConfig;

  subscriptions: Subscription[] = [];

  username: String;
  password: String;

  badCred : String;
  sessionExp : String;

  agent: Agent;

  showLoading : boolean;

  constructor(public configService: ConfigService,
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private router: Router) { }

  ngOnInit(): void {

    this.showLoading = false;

    if(this.authenticationService.isLoggedIn()){
      this.router.navigateByUrl('/');
    }else{
      //just to be safe
      this.router.navigateByUrl('/login');
    }

    this.config = this.configService.config;
    this.subscriptions.push(this.configService.configUpdate$.subscribe(config => {
      this.config = config;
    }));

    this.sessionExp = this.authenticationService.expiredMsg;
  }

  ngOnDestroy(): void {
    for(let i = 0; i < this.subscriptions.length; i++){
      if (this.subscriptions[i]) {
        this.subscriptions[i].unsubscribe();
      }
    }
  }

  onSubmit() {
    this.showLoading = true

    this.agent = {
      'username': this.username,
      'password': this.password,
    }

    this.subscriptions.push(
      this.authenticationService.login(this.agent).subscribe(
        (response: any) => {
          const token = response.body["access_token"];
          this.authenticationService.saveToken(token);
          const refreshtoken = response.body["refresh_token"];
          this.authenticationService.saveRefreshToken(refreshtoken);
          this.authenticationService.addAgentRoleToLocalCache()
          this.authenticationService.expiredMsg = null
          this.router.navigateByUrl('/');
        },
        (error: HttpErrorResponse) => {
          this.showLoading = false;
          this.showLoading = false;
          this.badCred = "Nom d'utilisateur ou mot de passe incorrect. Réessayez."
          this.messageService.add({ severity: 'error', summary: 'Authentification échouée', detail: this.badCred+"", life: 5000, closable : false });
        }
    ));

  }

  resetPassword(){
    this.messageService.add({ severity: 'info', summary: 'Information', detail: 'Veuillez contacter l\'administration', life: 5000 });
  }
}
