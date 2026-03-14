// app.component.ts - Version finale
import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
  // ✅ Plus de référence à app.component.scss
})
export class AppComponent implements OnInit {
  menuMode: string = 'static';
  private readonly DEFAULT_SCALE: number = 14;

  constructor(private primengConfig: PrimeNGConfig) {}

  ngOnInit(): void {
    this.primengConfig.ripple = true;
    document.documentElement.style.fontSize = `${this.DEFAULT_SCALE}px`;
    this.loadSavedTheme();
  }

  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark-seas') {
      document.body.classList.add('dark-seas-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-seas-theme');
    }
  }
}