import { Routes } from '@angular/router';
import { PostList } from './posts/post-list/post-list';
import { PostDetail } from './posts/post-detail/post-detail';

export const routes: Routes = [
  { path: '', component: PostList },
  { path: 'posts/:id', component: PostDetail }
];