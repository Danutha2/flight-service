import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Raw, Repository } from 'typeorm';
import { Flight } from 'src/entity/entity.flight';
import { flightInfo } from './flight-info.dto';

@Injectable()
export class FlightInfoService {
  private readonly logger = new Logger(FlightInfoService.name);

  constructor(
    @InjectRepository(Flight)
    private readonly flightRepository: Repository<Flight>,
  ) { }

  async findByLocation(from: string, destination: string, departTime?: string) {
    this.logger.debug(
      `Request received to search flights | from=${from}, destination=${destination}, departTime=${departTime}`,
    );

    try {
      const whereCondition: any = { from, destination };
      if (departTime) {
        const departDate = new Date(departTime);
        const start = new Date(departDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(departDate);
        end.setHours(23, 59, 59, 999);
        this.logger.debug(`Searching Date is ${Between(start,end)}`)

        whereCondition.departTime = Between(start, end);
      }

      const flights = await this.flightRepository.find({ where: whereCondition });

      if (flights.length === 0) {
        if (departTime) {
          this.logger.warn(
            `No flights found from=${from} to=${destination} on ${new Date(departTime).toDateString()}`,
          );
        } else {
          this.logger.warn(
            `No flights found from=${from} to=${destination}`,
          );
        }
      } else {
        if (departTime) {
          this.logger.log(
            `Successfully found ${flights.length} flight(s) from=${from} to=${destination} on ${new Date(departTime).toDateString()}`,
          );
        } else {
          this.logger.log(
            `Successfully found ${flights.length} flight(s) from=${from} to=${destination}`,
          );
        }
      }

      return flights;
    } catch (error) {
      this.logger.error(
        `Failed to fetch flights | from=${from}, destination=${destination}, error=${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch flight information. Please try again later.',
      );
    }
  }



  async addFlightInfo(flightDTOs: flightInfo[]): Promise<flightInfo[]> {
    this.logger.log(
      `Received request to add ${flightDTOs.length} flight(s) to the database`,
    );
    this.logger.debug(`Flight DTOs Payload: ${JSON.stringify(flightDTOs)}`);

    try {
      const newFlights = this.flightRepository.create(flightDTOs);
      this.logger.debug(`Mapped DTOs to entities successfully`);

      const savedFlights = await this.flightRepository.save(newFlights);
      this.logger.log(
        ` Successfully added ${savedFlights.length} flight(s) to the database`,
      );

      return savedFlights;
    } catch (error) {
      this.logger.error(
        ` Failed to add flight(s) to the database | error=${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to add flight information. Please try again later.',
      );
    }
  }
}
