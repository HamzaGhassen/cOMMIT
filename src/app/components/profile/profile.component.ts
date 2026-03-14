import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { AgentService } from 'src/app/services/agent.service';
import { Agent } from 'src/shared/Agent';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  providers: [MessageService],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  agent: Agent;
  editedAgent: Agent;
  isEditing: boolean = false;

  constructor(private agentService: AgentService,
    private messageService: MessageService,
    private primengConfig: PrimeNGConfig) { }

  ngOnInit(): void {
    this.getAgent();
    this.primengConfig.ripple = true;
  }

  getAgent() {
    this.agentService.getAgentByToken().subscribe
      ((response: Agent) => {
        this.agent = response;
        this.initEditedAgent();
      },
        (error: HttpErrorResponse) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Chargement échoué', life: 3000 });
        }
      )
  }

  initEditedAgent() {
    this.editedAgent = JSON.parse(JSON.stringify(this.agent)); // Deep copy
    // Convert birthDate from dd/MM/yyyy to yyyy-MM-dd for the HTML5 date input
    if (this.editedAgent && this.editedAgent.user && this.editedAgent.user.birthDate) {
      const parts = this.editedAgent.user.birthDate.toString().split('/');
      if (parts.length === 3) {
        this.editedAgent.user.birthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.initEditedAgent(); // Reset if cancelled
    }
  }

  saveProfile() {
    this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Sauvegarde en cours...', life: 2000 });

    // Create payload and convert birthDate back to dd/MM/yyyy for the backend
    let payload = JSON.parse(JSON.stringify(this.editedAgent));
    if (payload.user && payload.user.birthDate) {
      if (payload.user.birthDate.includes('-')) {
        const parts = payload.user.birthDate.split('-');
        if (parts.length === 3) {
          payload.user.birthDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
    }

    this.agentService.updateProfile(payload).subscribe(
      (response: Agent) => {
        this.agent = response;
        this.isEditing = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Profil mis à jour', life: 3000 });
      },
      (error: HttpErrorResponse) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Mise à jour échouée', life: 3000 });
      }
    )
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/default-avatar.png';
  }

}
