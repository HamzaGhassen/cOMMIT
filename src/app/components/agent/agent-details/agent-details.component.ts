import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { Agent } from 'src/shared/Agent';
import { AgentService } from 'src/app/services/agent.service';


@Component({
  selector: 'app-agent-details',
  templateUrl: './agent-details.component.html',
  styleUrls: ['./agent-details.component.scss'],
  providers: [MessageService],

})
export class AgentDetailsComponent implements OnInit {

  pathId : number;

  mailto : String;

  currentAgent : Agent;

  constructor(private route : ActivatedRoute,
              private agentService : AgentService,
              private messageService: MessageService) { }

  ngOnInit(): void {

    this.pathId = parseInt(this.route.snapshot.paramMap.get('id'));
    this.getAgent();

  }


  getAgent() {
    this.agentService.getAgentById(this.pathId).subscribe
      ((response: Agent) => {
        this.currentAgent = response;
        this.mailto = "mailto:" + response.email
      },
        (error: HttpErrorResponse) => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Chargement échoué', life: 3000 });
        }
      )
  }

}
