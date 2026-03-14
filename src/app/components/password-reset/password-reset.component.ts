import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AgentService } from 'src/app/services/agent.service';

export const passwordMatchingValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { notmatched: true };
};

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  providers: [MessageService],
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit {

  pwdForm: FormGroup;

  constructor(private agentService: AgentService,
              private messageService: MessageService
  ) { }

  ngOnInit(): void {

    this.pwdForm = new FormGroup({
      password: new FormControl('', [
        Validators.required,
        Validators.pattern('^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*_=+\-]).{8,20}$'),
      ]),
      confirmPassword: new FormControl(''),
    }, { validators: [passwordMatchingValidator] })

  }

  resetPassword(){
    this.agentService.resetPassword(this.pwdForm.get('password').value).subscribe(
      (response: any) => {
        this.messageService.add({ severity: 'success', summary: 'Succèss', detail: 'Mot de passe modifiée avec succès', life: 3000 });
        this.pwdForm.reset();
      },
      (error: HttpErrorResponse) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Enregistrement échoué', life: 3000 });
      }
    );
  }

  get password() {
    return this.pwdForm.get('password');
  }

}
