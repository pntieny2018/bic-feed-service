import { Injectable, PipeTransform } from "@nestjs/common";
import { REQUEST_CONTEXT } from "../interceptors/user.interceptor";

@Injectable()
export class StripRequestContextPipe implements PipeTransform {
  public transform(value: any) {
    //return omit(value, REQUEST_CONTEXT);
  }
}