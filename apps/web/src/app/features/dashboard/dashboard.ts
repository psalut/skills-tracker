import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  readonly stats = [
    { label: 'Active skills', value: '12' },
    { label: 'In progress', value: '7' },
    { label: 'Completed goals', value: '3' },
  ];

  readonly focusSkills = [
    { name: 'Angular', current: 6, target: 8 },
    { name: 'Node.js', current: 7, target: 9 },
    { name: 'TypeScript', current: 8, target: 9 },
  ];

  getProgress(current: number, target: number): number {
    return Math.min(Math.round((current / target) * 100), 100);
  }
}