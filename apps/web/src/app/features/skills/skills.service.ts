import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateSkillRequest, Skill, UpdateSkillRequest } from './skill.model';

@Injectable({
  providedIn: 'root',
})
export class SkillsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getSkills(): Promise<Skill[]> {
    return firstValueFrom(this.http.get<Skill[]>(`${this.baseUrl}/skills`));
  }

  createSkill(payload: CreateSkillRequest): Promise<Skill> {
    return firstValueFrom(
      this.http.post<Skill>(`${this.baseUrl}/skills`, payload),
    );
  }

  updateSkill(id: string, payload: UpdateSkillRequest): Promise<Skill> {
    return firstValueFrom(
      this.http.patch<Skill>(`${this.baseUrl}/skills/${id}`, payload),
    );
  }
}
