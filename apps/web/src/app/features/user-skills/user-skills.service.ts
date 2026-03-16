import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateUserSkillRequest,
  UpdateUserSkillRequest,
  UserSkill,
} from '../skills/skill.model';

@Injectable({
  providedIn: 'root',
})
export class UserSkillsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getUserSkills(): Promise<UserSkill[]> {
    return firstValueFrom(
      this.http.get<UserSkill[]>(`${this.baseUrl}/user-skills`),
    );
  }

  createUserSkill(payload: CreateUserSkillRequest): Promise<UserSkill> {
    return firstValueFrom(
      this.http.post<UserSkill>(`${this.baseUrl}/user-skills`, payload),
    );
  }

  updateUserSkill(
    id: string,
    payload: UpdateUserSkillRequest,
  ): Promise<UserSkill> {
    return firstValueFrom(
      this.http.patch<UserSkill>(`${this.baseUrl}/user-skills/${id}`, payload),
    );
  }
}
