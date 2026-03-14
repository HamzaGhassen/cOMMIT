import { Component } from '@angular/core';
import { MainComponent } from './main.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
})
export class FooterComponent {

  constructor(public appMain: MainComponent) { }


}
